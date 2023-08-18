import React, { useState, useEffect } from 'react';
import './App.css';

function App() {

  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);

  const fetchData = async (pageNumber) => {
    try {
      const response = await fetch(`/app-api/v1/photo-gallery-feed-page/page/${pageNumber}`);
      const responseData = await response.json();
      return responseData.nodes;
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    const fetchPageData = async () => {
      const newPageData = await fetchData(page);
      if (newPageData) {
        setData(prevData => [...prevData, ...newPageData]);
      }
    };
    fetchPageData();
  }, [page]);

  const handleScroll = () => {
    if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 20) {
      console.log("reached bottom")
      setPage(prevPage => prevPage + 1);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="App">
      <h1>Photo Gallery</h1>
      <div className="gallery">
        {data.map(item => (
          <div className="card" key={item.node.nid}>
            <img className="card-image" src={item.node.ImageStyle_thumbnail} alt={item.node.title} />
            <div className="card-title">{item.node.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
