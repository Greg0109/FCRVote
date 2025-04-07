export const Label = ({
  label,
  htmlFor,
}: {
  label: string;
  htmlFor: string;
}) => (
  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={htmlFor}>
    {label}
  </label>
);