import '../style/unified.css';
import {RemoveButton} from "./button";

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

export const CandidateCard = ({
  photo,
  name,
  description,
  ...props
}: {
  photo: string;
  name: string;
  description: string;
} & React.HTMLProps<HTMLDivElement>) => (
  <div className="fcr-card-body candidate-card" {...props}>
    <img src={photo} alt={name} className="candidate-photo" />
    <div className="candidate-info">
      <h3 className="candidate-name">{name}</h3>
      <p className="candidate-description">{description}</p>
    </div>
  </div>
);

export const AdminCandidateCard = ({
  photo,
  name,
  description,
  onRemove,
  ...props
}: {
  photo: string;
  name: string;
  description: string;
  onRemove: () => void;
} & React.HTMLProps<HTMLDivElement>) => (
  <div className="fcr-card-body candidate-card" {...props}>
    <img src={photo} alt={name} className="candidate-photo" />
    <div className="candidate-info">
      <h3 className="candidate-name">{name}</h3>
      <p className="candidate-description">{description}</p>
    </div>
    <RemoveButton onClick={onRemove}></RemoveButton>
  </div>
);