export function SearchableSelect({ placeholder = 'Select...', onChange, ..._ }: any) {
  return <select className="input-base" onChange={(e) => onChange?.(e.target.value)}><option value="">{placeholder}</option></select>;
}