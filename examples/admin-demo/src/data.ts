export interface Order {
  id: string;
  customer: string;
  status: string;
  items: number;
  total: number;
  placed: string; // ISO date
}

export const customers = [
  "Ada Lovelace",
  "Grace Hopper",
  "Linus Torvalds",
  "Margaret Hamilton",
  "Alan Turing",
  "Katherine Johnson",
  "Tim Berners-Lee",
  "Barbara Liskov",
  "Radia Perlman",
  "Donald Knuth",
];

export const statuses = ["Pending", "Paid", "Shipped", "Delivered", "Refunded"];

/** Deterministic fake orders over the last 180 days. */
export function makeOrders(count: number): Order[] {
  let seed = 7;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => ({
    id: `ORD-${String(count - i).padStart(6, "0")}`,
    customer: customers[Math.floor(rand() * customers.length)],
    status: statuses[Math.floor(rand() * statuses.length)],
    items: 1 + Math.floor(rand() * 9),
    total: Math.round(rand() * 90000) / 100 + 5,
    placed: new Date(now - Math.floor(rand() * 180) * 86400000).toISOString().slice(0, 10),
  }));
}
