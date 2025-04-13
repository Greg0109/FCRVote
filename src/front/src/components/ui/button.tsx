import '../style/button.css';

export const Button = ({ children, ...props }: any) => (
  <button className="fcr-button" {...props}>
    {children}
  </button>
);

export const RemoveButton = ({ children, ...props }: any) => (
  <button className="fcr-remove-button" {...props}>
    {children}
  </button>
);

export const LogoutButton = ({ children, ...props }: any) => (
  <button className="fcr-logout-button" {...props}>
    {children}
  </button>
);