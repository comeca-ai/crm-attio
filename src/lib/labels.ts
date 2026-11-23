const L: Record<string, { all: string; new: string; empty: string }> = {
  companies: { all: "Todas as empresas", new: "Nova empresa", empty: "Nenhuma empresa ainda" },
  people: { all: "Todas as pessoas", new: "Nova pessoa", empty: "Nenhuma pessoa ainda" },
  deals: { all: "Todos os negócios", new: "Novo negócio", empty: "Nenhum negócio ainda" },
};
export const objLabels = (slug: string) => L[slug] ?? { all: "Todos os registros", new: "Novo registro", empty: "Nenhum registro ainda" };

export function greeting(d = new Date()) {
  const h = d.getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}
