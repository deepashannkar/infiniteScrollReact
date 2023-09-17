import React, { useState, useEffect } from "react";
import { Machine, assign } from "xstate";
import { useMachine } from "@xstate/react";

const states = {
    IDLE: "IDLE",
    DEBOUNCING: "DEBOUNCING",
    DISPLAYING_SUGGESTIONS: "DISPLAYING_SUGGESTIONS",
    SEARCHING: "SEARCHING"
};

const searchNotEmptyTarget = {

    target: states.SEARCHING,
    cond: (_ctx, evt) => evt.search !== "",
    actions: assign({ search: (_ctx, evt) => evt.search })

};

const searchEmptyTarget = {
    target: states.IDLE,
    actions: assign({ search: (_ctx, evt) => evt.search })
};

const searchMachine = Machine(
    {
        id: "search",
        initial: states.IDLE,
        context: {
            search: ""
        },
        states: {
            [states.IDLE]: {
                on: {
                    FETCHING: [searchNotEmptyTarget],
                    // FETCHING: states.SEARCHING
                }
            },
            [states.DISPLAYING_SUGGESTIONS]: {
                on: {
                    FETCHING: [searchNotEmptyTarget, searchEmptyTarget],
                    SUBMIT: states.SEARCHING
                }
            },
            [states.SEARCHING]: {
                invoke: {
                    src: "fetchData",
                    onDone: {
                        target: `#search.${states.DISPLAYING_SUGGESTIONS}`,
                        actions: assign({
                            suggestions: (_ctx, evt) => evt.data
                        })
                    }
                }
            }
        }
    },
    {
        services: {
            fetchData: _ctx => {
                return new Promise((resolve, reject) => {
                    setTimeout(async () => {
                        try {
                            const response = await fetch(`/app-api/v1/photo-gallery-feed-page/page/1`);
                            const responseData = await response.json();
                            resolve(responseData.nodes);
                        } catch (error) {
                            reject(error);
                        }
                    }, 1000); // Simulate an asynchronous operation with a delay
                });
            }
        }
    }
);

export default function App() {
    const [current, send] = useMachine(searchMachine);
    const [data, setData] = useState([]);
    const [page, setPage] = useState(1);
    const { context, value } = current;
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearchData, setShowSearchData] = useState(false);
    const [filteredData, setFilteredData] = useState([]);

    useEffect(() => {
        const fetchPageData = async () => {
            const newPageData = await fetchData(page);
            if (newPageData) {
                setData((prevData) => [...prevData, ...newPageData]);
            }
        };
        fetchPageData();
    }, [page]);

    const handleScroll = () => {
        if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 20) {
            setPage((prevPage) => prevPage + 1);
        }
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
    };

    useEffect(() => {
        if (searchQuery) {
            setShowSearchData(true);
            const filtered = data.filter((item) => item.node.title.toLowerCase().includes(searchQuery.toLowerCase()));
            setFilteredData(filtered);
        } else {
            setShowSearchData(false);
            setFilteredData([]);
        }
    }, [searchQuery, data]);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);


    const fetchData = async (pageNumber) => {
        try {
            const response = await fetch(`/app-api/v1/photo-gallery-feed-page/page/${pageNumber}`);
            const responseData = await response.json();
            return responseData.nodes;
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    return (
        <div className="App">
            <div>State: {value}</div>
            <h1>Photo Gallery</h1>
            <div>
                <input
                    type="text"
                    placeholder="Search..."
                    onChange={(e) => {
                        handleSearch(e.target.value);
                        send("FETCHING", { search: e.target.value });
                    }}
                />
            </div>
            <div className="gallery">
                {showSearchData ? (
                    filteredData.map((item, index) => (
                        <div className="card" key={index}>
                            <img
                                className="card-image"
                                src={item.node.ImageStyle_thumbnail}
                                alt={item.node.title}
                            />
                            <div className="card-title">{item.node.title}</div>
                        </div>
                    ))
                ) : (
                    data.map((item, index) => (
                        <div className="card" key={index}>
                            <img
                                className="card-image"
                                src={item.node.ImageStyle_thumbnail}
                                alt={item.node.title}
                            />
                            <div className="card-title">{item.node.title}</div>
                        </div>
                    ))
                )}
            </div>

            {current.matches(`${states.SEARCHING}`) &&
                "Loading"}
        </div>
    );
}
