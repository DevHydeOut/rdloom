import { CustomerTable, type Customer } from "@rdloom/react";

const people = [
  ["Ada Lovelace", "Analytical Co"], ["Grace Hopper", "Compiler Labs"], ["Katherine Johnson", "Orbit Systems"], ["Alan Turing", "Enigma Works"],
  ["Margaret Hamilton", "Apollo Software"], ["Dennis Ritchie", "Bell Studio"], ["Barbara Liskov", "Substitution Inc"], ["Edsger Dijkstra", "Shortest Path"],
  ["Radia Perlman", "Spanning Tree"], ["Donald Knuth", "Literate Press"], ["Frances Allen", "Optimise Ltd"], ["Linus Torvalds", "Kernel House"],
  ["Hedy Lamarr", "Spread Spectrum"], ["Tim Berners-Lee", "Web Works"], ["Annie Easley", "Rocket Code"], ["Ken Thompson", "Pipe Dream"],
  ["Shafi Goldwasser", "Zero Knowledge"], ["Vint Cerf", "Packet Co"], ["Mary Jackson", "Wind Tunnel"], ["John McCarthy", "Lisp Labs"],
  ["Sophie Wilson", "Instruction Set"], ["Guido van Rossum", "Indent Inc"], ["Evelyn Boyd Granville", "Orbit Maths"], ["Niklaus Wirth", "Pascal Press"],
];
const plans = ["Free", "Pro", "Team", "Enterprise"];
const price = [0, 29, 99, 499];
const statuses = ["active", "active", "trial", "overdue", "active", "churned", "active"];

// Every customer has a plan, a status, monthly revenue and a join date. The block does the rest.
const customers: Customer[] = people.map(([name, company], i) => {
  const plan = i % 4;
  return {
    id: `c${i + 1}`,
    name,
    company,
    email: `${name.split(" ")[0].toLowerCase()}@example.com`,
    plan: plans[plan],
    status: statuses[i % statuses.length],
    mrr: price[plan],
    joinedAt: `2026-${String(1 + (i % 9)).padStart(2, "0")}-${String(3 + ((i * 5) % 24)).padStart(2, "0")}`,
  };
});

export default function CustomerTableBasicExample() {
  return (
    <div className="mx-auto w-[60rem] max-w-full">
      <CustomerTable customers={customers} pageSize={8} />
    </div>
  );
}
