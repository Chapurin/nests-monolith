export interface IProductWithBrand {
  id: string;
  title: string;
  description: string | null;
  brand: {
    title: string;
  } | null;
}
