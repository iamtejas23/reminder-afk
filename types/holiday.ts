export type Holiday = {
  id: string;
  name: string;
  /** Local calendar date in YYYY-MM-DD format. */
  date: string;
  /** Optional festive emoji or symbol. */
  icon?: string;
};
