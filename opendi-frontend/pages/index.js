import { useState, useEffect } from 'react';
import Head from 'next/head';
import Dropzone from 'react-dropzone-uploader';
import Papa from 'papaparse';
import 'react-dropzone-uploader/dist/styles.css';
import Chat from '../components/Chat';
import ModeButtons from '../components/ModeButtons'
import Tooltip from '../components/Tooltip'
import SocialMetaTags from '../components/SocialMetaTags';
import NavBar from '../components/NavBar'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons';



const Home = () => {
  const [csvFile, setCsvFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [headerValues, setHeaderValues] = useState({});

  const [apiError, setApiError] = useState('');
  const [isErrorMessageVisible, setIsErrorMessageVisible] = useState(false);

  const [messages, setMessages] = useState([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState("GPT-4");
  const [allowLogging, setAllowLogging] = useState(false);
  
  const [darkMode, setDarkMode] = useState(true);


  const handleSendMessage = (message) => {
    setMessages([...messages, { text: message, isUser: true, images: [] }]);
  };

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prevDarkMode => !prevDarkMode);
  };

  const handleChangeStatus = async ({ meta, file }, status) => {
    if (status === 'done') {
      setCsvFile(file); // Keep a reference to the file itself
      const results = await new Promise((resolve, reject) => {
        Papa.parse(file, {
          complete: resolve,
          error: reject,
        });
      });

      // Trim the headers
      const trimmedHeaders = results.data[0].map(header => header.trim());
      
      setCsvHeaders(trimmedHeaders);
      setCsvData(results.data);

      const initialHeaderValues = trimmedHeaders.reduce((acc, header) => {
        acc[header] = '';
        return acc;
      }, {});

      setHeaderValues(initialHeaderValues);
    }
    else if (status === 'removed') {
      setCsvFile(null);
      setCsvHeaders([]);
      setCsvData([]);
      setHeaderValues({});
    }
  };


  const handleInputChange = (header, value) => {
    setHeaderValues(prevValues => ({
      ...prevValues,
      [header]: value,
    }));
  };

  const removeHeader = (indexToRemove, headerToRemove) => {
    // Update csvHeaders
    setCsvHeaders(csvHeaders.filter((_, index) => index !== indexToRemove));
  
    // Update headerValues
    const newHeaderValues = {...headerValues};
    delete newHeaderValues[headerToRemove];
    setHeaderValues(newHeaderValues);
  };

  const handleSubmit = async (e, newMessage = null) => {
    e.preventDefault();

    if (!csvFile) {
      setApiError('No CSV file uploaded.');
      setIsErrorMessageVisible(true);
  
      setTimeout(() => {
        setIsErrorMessageVisible(false); // Hide the error message after 5 seconds
      }, 5000);
  
      return;
    }

    try {
      setIsSubmitting(true);
      let formData = new FormData();
      formData.append('file', csvFile);
      formData.append('columnData', JSON.stringify(headerValues));
      const updatedMessages = newMessage
        ? [...messages, { text: newMessage, isUser: true, images: [] }]
        : [...messages];
      setMessages(updatedMessages);
      formData.append('messages', JSON.stringify(updatedMessages));
      formData.append('model', mode)
      formData.append('allowLogging', allowLogging)
      
      const res = await fetch('https://openci-server.brilliantly.ai/heavy', {
      // const res = await fetch('http://localhost:8000/heavy', {
        method: 'POST',
        body: formData,
      });	  
	  
      if (res.status === 200) {
        const responseBody = await res.json();
        let asstMsg = responseBody.answer;
        setMessages([...updatedMessages, { text: asstMsg, isUser: false, images: responseBody.images }]);
      }
    } catch (err) {
	    console.log(err);
      setMessages(prevMessages => prevMessages.slice(0, -1));
      if (err.response && err.response.status === 413) {
        setApiError('File too large. Please upload a file smaller than 25MB.');
      } else {
        setApiError('An error occurred while processing your file.');
      }
	    setIsErrorMessageVisible(true); // Show the error message
  
      setTimeout(() => {
        setIsErrorMessageVisible(false); // Hide the error message after 5 seconds
      }, 5000);
    } finally {
      setIsSubmitting(false); // End submission regardless of success or failure
    }
  };

  return (
    <>
      <Head>
        <title>Open Data Interpreter: Talk to your data.</title>
      </Head>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <SocialMetaTags
          title="Open Data Interpreter: Talk to your data."
          description="Made with love and AI by Brilliantly."
          url="https://datainterpreter.brilliantly.ai/"
          imageUrl="https://datainterpreter.brilliantly.ai/logo.png"
        />
        <NavBar />
        
        <div
          className="flex flex-col w-full max-w-7xl bg-white dark:bg-gray-800 shadow-md rounded px-8 pt-6 pb-8 mb-4 overflow-auto"
          style={{height: 'calc(100vh - 100px)', marginTop: '60px'}}
        >
          <h1
            className="text-6xl font-bold text-center mb-4"
            style={{
                fontFamily: 'Quicksand',
                fontWeight: 'bold',
                backgroundImage: 'linear-gradient(135deg, #CB5EEE 0%, #4BE1EC 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
            }}
          >
            <span>
              <button
                className="focus:outline-none"
                onClick={toggleDarkMode}
                style={{ color: '#B67EEF' }}
              >
                <FontAwesomeIcon icon={darkMode ? faSun : faMoon} />
              </button>pen Data Interpreter
            </span>
          </h1>
          <div className="flex flex-grow overflow-auto">
            <div className="w-full lg:w-1/2 overflow-auto">
              <form onSubmit={handleSubmit} className="w-full max-w-7xl bg-white dark:bg-gray-800 shadow-md rounded px-8 pt-6 pb-8 mb-4">
                <div className="mb-4 bg-gray-200 dark:bg-gray-500">
                  <Dropzone
                    inputContent="Drag a CSV file or Click to Browse"
                    onChangeStatus={handleChangeStatus}
                    accept=".csv"
                    maxFiles={1}
                  />
                </div>
                {csvHeaders.map((header, index) => (
                  <div className="mb-4 flex items-center" key={index}>
                    <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2 w-1/3 text-right pr-4 align-middle" htmlFor={header}>
                      {header}
                    </label>
                    <input
                      className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline flex-grow"
                      id={header}
                      type="text"
                      placeholder={`Description of ${header}`}
                      value={headerValues[header] || ''}
                      onChange={(e) => handleInputChange(header, e.target.value)}
                    />
                    <button type="button" onClick={() => removeHeader(index, header)} className="ml-2 py-2">✕</button>
                  </div>
                ))}
                <ModeButtons mode={mode} onModeChange={setMode}/>
                <div className="flex items-center my-2">
                  <input
                    type="checkbox"
                    id="allowLogging"
                    checked={allowLogging}
                    onChange={(e) => setAllowLogging(prevAllowLogging => !prevAllowLogging)}
                    className="form-checkbox h-5 w-5 text-blue-600 mr-2"
                  />
                  <label htmlFor="allowLogging" className="text-gray-700 dark:text-gray-200">
                    Allow server logging
                  </label>
                  <Tooltip content={ <>Logs may include parts of uploaded data and the server response. Either way, your file is not stored. </> } />
                </div>


                <div className="flex items-center justify-between">
                  {apiError && isErrorMessageVisible && <p className="text-red-500 dark:text-red-400">{apiError}</p>}
                </div>
              </form>
              <div className="overflow-y-auto" style={{ maxHeight: "50vh" }}>
                <table className="text-gray-700 dark:text-gray-200">
                  <thead>
                    <tr>
                      {csvData[0] && Object.values(csvData[0]).map(val => <th key={val}>{val}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.slice(1, 51).map((row, index) => (
                      <tr key={index}>
                        {Object.values(row).map((value, index) => <td key={index}>{value}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="w-full lg:w-1/2 overflow-auto" style={{ maxHeight: `calc(90vh - 100px)` }}>
              <Chat 
                messages={messages}
                setMessages={setMessages}
                onSendMessage={handleSubmit}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>
        </div>
      </div>
    </>

  );
};

export default Home;