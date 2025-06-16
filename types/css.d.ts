declare module "*.css?raw" {
  const content: string;
  export default content;
}

declare module "*.css?url" {
  const url: string;
  export default url;
}
