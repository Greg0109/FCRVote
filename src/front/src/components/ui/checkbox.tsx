export const Checkbox = ({
  label,
  htmlFor,
  checked,
  onChange,
}: {
  label: string;
  htmlFor: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <div className="flex items-center mb-4">
    <input
      type="checkbox"
      id={htmlFor}
      checked={checked}
      onChange={onChange}
      className="mr-2 leading-tight"
    />
    <label className="text-sm" htmlFor={htmlFor}>
      {label}
    </label>
  </div>
);