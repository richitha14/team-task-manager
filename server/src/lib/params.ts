export function paramId(value: string | string[] | undefined): string {
  const id = Array.isArray(value) ? value[0] : value;
  if (!id) {
    throw new Error("Route parameter is required");
  }
  return id;
}
