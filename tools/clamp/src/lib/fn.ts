import { z } from "zod";

export function fn<T extends z.ZodType, Result>(
  schema: T,
  cb: (input: z.infer<T>) => Result,
) {
  const result = ((input: z.infer<T>) => {
    const parsed = schema.parse(input);
    return cb(parsed);
  }) as ((input: unknown) => Result) & {
    force: (input: z.infer<T>) => Result;
    schema: T;
  };
  result.force = (input) => cb(input);
  result.schema = schema;
  return result;
}
