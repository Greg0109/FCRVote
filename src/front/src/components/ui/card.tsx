export const Card = ({ children, ...props }: React.HTMLProps<HTMLDivElement>) => (
  <div className="border rounded p-4 shadow" {...props}>{children}</div>
);
export const CardContent = ({ children, ...props }: React.HTMLProps<HTMLDivElement>) => (
  <div {...props}>{children}</div>
);

export const CardHeader = ({ children, ...props }: React.HTMLProps<HTMLDivElement>) => (
  <div className="mb-4" {...props}>{children}</div>
);

export const CardTitle = ({ children, ...props }: React.HTMLProps<HTMLHeadingElement>) => (
  <h2 className="text-xl font-bold" {...props}>{children}</h2>
);