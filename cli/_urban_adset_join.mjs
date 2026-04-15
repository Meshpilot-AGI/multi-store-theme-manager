import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Meta adset_id → human name mapping
const ADSET_NAMES = {
  '120245399880370502': '1% LAL M/F 21-50 (active campaign)',
  '120245349263930502': 'Broad M 20-50 (active campaign)',
  '120244384179490502': '1% LAL M/F 20-50 (paused campaign)',
  '120244240393780502': 'Broad M 20-50 (paused campaign)',
};

const shop = '52j1ga-hz.myshopify.com' in {} ? null : 'f51039.myshopify.com';
const session = await prisma.session.findFirst({ where: { shop, isOnline: false }});
const token = session.accessToken;

async function gql(query, variables = {}) {
  const res = await fetch(`https://${shop}/admin/api/2024-10/graphql.json`, {
    method: 'POST',
    headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  return (await res.json()).data;
}

const all = [];
let cursor = null;
let page = 0;
while (true) {
  page++;
  const data = await gql(`
    query($c: String) {
      orders(first: 100, after: $c, query: "created_at:>=2026-03-16 created_at:<=2026-04-15", sortKey: CREATED_AT) {
        pageInfo { hasNextPage endCursor }
        edges {
          node {
            id
            name
            createdAt
            displayFinancialStatus
            currentTotalPriceSet { shopMoney { amount } }
            customAttributes { key value }
          }
        }
      }
    }`, { c: cursor });
  const edges = data.orders.edges;
  all.push(...edges.map(e => e.node));
  if (!data.orders.pageInfo.hasNextPage) break;
  cursor = data.orders.pageInfo.endCursor;
  if (page > 10) break;
}

console.log(`Pulled ${all.length} orders across ${page} pages`);

// Aggregate by utm_term (adset_id)
const byAdset = {};
for (const o of all) {
  const attrs = Object.fromEntries((o.customAttributes || []).map(a => [a.key, a.value]));
  const adset = attrs['utm_term'] || 'NO_UTM';
  const gw = attrs['Payment Gateway'] || '-';
  const source = attrs['utm_source'] || '';
  const isPrepaid = gw && gw !== '-' && gw !== '' && !gw.toLowerCase().includes('cod');
  const amount = parseFloat(o.currentTotalPriceSet.shopMoney.amount);

  if (!byAdset[adset]) byAdset[adset] = {
    total: 0, prepaid: 0, cod: 0,
    paid: 0, pending: 0, voided: 0,
    revenue_all: 0, revenue_paid: 0,
  };
  const b = byAdset[adset];
  b.total++;
  if (isPrepaid) b.prepaid++; else b.cod++;
  if (o.displayFinancialStatus === 'PAID') { b.paid++; b.revenue_paid += amount; }
  else if (o.displayFinancialStatus === 'PENDING') b.pending++;
  else if (o.displayFinancialStatus === 'VOIDED') b.voided++;
  b.revenue_all += amount;
}

// Sort by spend equivalent (total orders)
const rows = Object.entries(byAdset).sort((a, b) => b[1].total - a[1].total);
console.log('\n=== Orders by Meta ad set (30d window) ===\n');
for (const [adsetId, b] of rows) {
  const name = ADSET_NAMES[adsetId] || (adsetId === 'NO_UTM' ? '(no UTM — direct/other)' : `unknown adset ${adsetId}`);
  const prepaidRate = b.total ? (b.prepaid / b.total * 100).toFixed(1) : '0';
  const paidRate = b.total ? (b.paid / b.total * 100).toFixed(1) : '0';
  console.log(`${name}  [${adsetId}]`);
  console.log(`  Orders:      ${b.total}`);
  console.log(`  Prepaid:     ${b.prepaid}  (${prepaidRate}% of orders)`);
  console.log(`  COD:         ${b.cod}`);
  console.log(`  Paid:        ${b.paid}  (${paidRate}% of orders show as paid in Shopify)`);
  console.log(`  Pending:     ${b.pending}  (still in COD flight / courier-sync broken)`);
  console.log(`  Voided:      ${b.voided}`);
  console.log(`  Revenue all: ₹${b.revenue_all.toFixed(0)}`);
  console.log(`  Revenue paid:₹${b.revenue_paid.toFixed(0)}`);
  console.log('');
}

await prisma.$disconnect();
