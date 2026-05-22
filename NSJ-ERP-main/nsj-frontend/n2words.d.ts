declare module "n2words" {
  interface N2WordsOptions {
    lang?: string;
    currency?: boolean;
  }

  export function n2words(number: number, options?: N2WordsOptions): string;
}
