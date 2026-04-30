import React from "react";
import axios from "axios";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

type CSVFileImportProps = {
  url: string;
  title: string;
};

export default function CSVFileImport({ url, title }: CSVFileImportProps) {
  const [file, setFile] = React.useState<File>();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setFile(file);
    }
  };

  const removeFile = () => {
    setFile(undefined);
  };

  const uploadFile = async () => {
    if (!file) return;

    const token = localStorage.getItem("authorization_token");
    const headers: Record<string, string> = {};

    if (token) {
      headers.Authorization = `Basic ${token}`;
    }

    try {
      const { data: signedUrl } = await axios.get<string>(url, {
        params: { name: file.name },
        headers,
      });

      await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": "text/csv" },
      });

      setFile(undefined);
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;

      if (status === 401) {
        alert("401 Unauthorized: Authorization header is missing or invalid.");
      } else if (status === 403) {
        alert("403 Forbidden: Access denied for the provided credentials.");
      } else {
        alert(`Upload failed${status ? ` (status ${status})` : ""}.`);
      }
    }
  };
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {!file ? (
        <input type="file" onChange={onFileChange} />
      ) : (
        <div>
          <button onClick={removeFile}>Remove file</button>
          <button onClick={uploadFile}>Upload file</button>
        </div>
      )}
    </Box>
  );
}
