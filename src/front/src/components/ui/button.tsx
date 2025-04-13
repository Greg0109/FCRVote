import '../style/button.css';

export const Button = ({ children, ...props }: any) => (
  <button className="fcr-button" {...props}>
    {children}
  </button>
);