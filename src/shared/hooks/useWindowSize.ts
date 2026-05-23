// This custom hook provides the current dimensions (width and height) of the browser window.
// It listens for the 'resize' event to keep the dimensions updated.

import { useEffect, useState } from 'react';

type windowSize = {
    width: number | undefined;
    height: number | undefined;
};
const useWindowSize = () => {
    // State to store the window's width and height.
    // It's initialized with undefined to indicate that the size has not yet been measured on the client.
    const [windowSize, setWindowSize] = useState<windowSize>({
        width: undefined,
        height: undefined,
    });

    useEffect(() => {
        // This function updates the state with the current window dimensions.
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        // Add an event listener for the 'resize' event when the component mounts.
        window.addEventListener('resize', handleResize);

        // Call the handler immediately to set the initial window size.
        handleResize();

        // The cleanup function removes the event listener when the component unmounts.
        // This is crucial to prevent memory leaks.
        return () => window.removeEventListener('resize', handleResize);
    }, []); // The empty dependency array ensures this effect runs only once on mount and unmount.

    // Return the current window size object.
    return windowSize;
};

export default useWindowSize;
