import { Search } from "lucide-react";

const SearchBar = ({ value, onChange, placeholder = "Buscar experiencias..." }) => {
  return (
    <div className="relative max-w-xl mx-auto" data-testid="search-bar">
      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
        <Search className="w-5 h-5 text-stone-400" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        data-testid="search-input"
        className="search-input w-full pl-14 pr-6 py-4 rounded-full border border-stone-200 bg-white text-stone-800 placeholder-stone-400 font-inter text-sm focus:outline-none focus:border-forest transition-all duration-300"
      />
    </div>
  );
};

export default SearchBar;
