export interface IProductWithBrand {
  id: string;
  title: string;
  description: string;
  brand: {
    title: string;
  };
}
