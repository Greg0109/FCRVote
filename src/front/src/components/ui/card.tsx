import '../style/card.css';

export const Card = ({ children, ...props }: React.HTMLProps<HTMLDivElement>) => (
  <div className="fcr-card" {...props}>{children}</div>
);

export const AdminCard = ({ children, ...props }: React.HTMLProps<HTMLDivElement>) => (
  <div className="fcr-admin-card" {...props}>{children}</div>
);

export const CardContent = ({ children, ...props }: React.HTMLProps<HTMLDivElement>) => (
  <div className="fcr-card-content" {...props}>{children}</div>
);

export const CardHeader = ({ children, ...props }: React.HTMLProps<HTMLDivElement>) => (
  <div className="fcr-card-title" {...props}>{children}</div>
);

export const CardTitle = ({ children, ...props }: React.HTMLProps<HTMLHeadingElement>) => (
  <h2 className="fcr-card-title" {...props}>{children}</h2>
);