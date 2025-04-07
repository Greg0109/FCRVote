export const Card = ({ children, ...props }: React.HTMLProps<HTMLDivElement>) => (
  <div className="border rounded p-4 shadow" {...props}>{children}</div>
);
export const CardContent = ({ children, ...props }: React.HTMLProps<HTMLDivElement>) => (
  <div {...props}>{children}</div>
);