import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, AutoComplete } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { searchSuggestions } from '@api/products';

export default function SearchBar({ style }: { style?: React.CSSProperties }) {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [open, setOpen] = useState(false);

  const { data: suggestions = [] } = useQuery({
    queryKey: ['search-suggestions', keyword],
    queryFn: () => searchSuggestions(keyword),
    enabled: keyword.length > 0,
  });

  const options = suggestions.map((s) => ({ value: s, label: s }));

  return (
    <AutoComplete
      options={options}
      value={keyword}
      open={open && keyword.length > 0}
      onSearch={setKeyword}
      onSelect={(val) => {
        navigate(`/search?q=${encodeURIComponent(val)}`);
        setOpen(false);
      }}
      onBlur={() => setOpen(false)}
      onFocus={() => setOpen(true)}
    >
      <Input
        prefix={<SearchOutlined />}
        placeholder="搜索商品..."
        allowClear
        style={{ width: 240, ...style }}
        onPressEnter={() => {
          if (keyword) {
            navigate(`/search?q=${encodeURIComponent(keyword)}`);
            setOpen(false);
          }
        }}
      />
    </AutoComplete>
  );
}
