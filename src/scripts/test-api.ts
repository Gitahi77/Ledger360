async function main() {
  const res = await fetch('http://localhost:3000/api/v1/transactions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-benchmark-user-id': 'cmrjag4x4000004joej6vkb5p'
    },
    body: JSON.stringify({
      accountId: 'cmrjag5b3000r04jo6hveljmt',
      categoryId: 'cmrjag52v000104jotm74e694',
      baseAmountMinor: 5000,
      type: 'expense',
      date: '2026-07-15',
      name: 'Grocery Shopping'
    })
  });
  console.log(res.status, await res.text());
}
main().catch(console.error);
