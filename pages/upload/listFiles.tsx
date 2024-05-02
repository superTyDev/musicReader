// pages/upload/listFiles.tsx

import React, { useEffect, useState } from "react";
import Image from "next/image";

const ListFilesPage = () => {
    const [blobs, setBlobs] = useState([]);

    useEffect(() => {
        fetch("/api/listFiles")
            .then((response) => response.json())
            .then((data) => {
                console.log(data);
                setBlobs(data);
            });
    }, []);

    return (
        <div>
            <h1>Uploaded Files</h1>
            <ul>
                {blobs.map((blob) => (
                    <li key={blob.uploadedAt}>
                        <Image
                            src={blob.url}
                            alt={blob.pathname}
                            width={50}
                            height={50}
                        />
                        {blob.pathname}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ListFilesPage;
