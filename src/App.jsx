
import React, { useState, useEffect } from "react";
import axios from "axios";
import Papa from "papaparse";
import {
  Box, Button, Container, Flex, Input, Select, Text, VStack,
  useToast, useColorModeValue
} from "@chakra-ui/react";

const chatURL = import.meta.env.VITE_CHAT_API_URL;
const uploadURL = import.meta.env.VITE_UPLOAD_API_URL;

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [faqSource, setFaqSource] = useState("default");
  const [file, setFile] = useState(null);
  const [sampleFAQs, setSampleFAQs] = useState([]);
  const toast = useToast();
  const bgColor = useColorModeValue("gray.700", "gray.700");
  const msgBgUser = useColorModeValue("blue.500", "blue.500");
  const msgBgBot = useColorModeValue("gray.600", "gray.600");

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const res = await axios.post(chatURL, {
        user_input: input,
        faq_source: faqSource,
      });

      });

      const botReply = {
        role: "assistant",
        content: res.data?.response || "Sorry, I couldn't understand that.",
      };

      setMessages((prev) => [...prev, botReply]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "❌ Could not reach the chatbot API." },
      ]);
    }
  };

  const handleUpload = () => {
    if (!file) {
      toast({ title: "No file selected", status: "warning", duration: 3000 });
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async function (results) {
        const columns = Object.keys(results.data[0] || {});
        const hasRequiredCols = columns.includes("question") && columns.includes("answer");

        if (!hasRequiredCols) {
          toast({
            title: "Invalid CSV",
            description: "CSV must contain 'question' and 'answer' columns.",
            status: "error",
            duration: 5000,
          });
          return;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
          const res = await axios.post(uploadURL, formData);
          if (res.status === 200) {
            toast({
              title: "FAQ uploaded and processed!",
              status: "success",
              duration: 3000,
            });
            setFaqSource("uploaded");

            const sample = results.data.sort(() => 0.5 - Math.random()).slice(0, 10);
            setSampleFAQs(sample);
          } else {
            throw new Error();
          }
        } catch (err) {
          toast({
            title: "Upload Failed",
            description: "Unable to upload FAQ file.",
            status: "error",
            duration: 3000,
          });
        }
      },
    });
  };

  useEffect(() => {
    if (faqSource === "default") {
      fetch("/default_faqs.csv")
        .then((res) => res.text())
        .then((text) => {
          Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              const sample = results.data.slice(0, 5);
              setSampleFAQs(sample);
            },
          });
        });
    } else {
      setSampleFAQs([]);
    }
  }, [faqSource]);

  return (
    <Container maxW="container.md" py={6}>
      <Text fontSize="2xl" fontWeight="bold" mb={4} color="white">💬 FAQ Chatbot</Text>

      <Flex mb={4} gap={4} wrap="wrap">
        <Select
          value={faqSource}
          onChange={(e) => setFaqSource(e.target.value)}
          width="40%"
          bg="gray.600"
          color="white"
        >
          <option value="default">Default FAQs</option>
          <option value="uploaded">Uploaded FAQs</option>
        </Select>

        <Input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files[0])}
          width="40%"
          bg="gray.600"
          color="white"
        />
        <Button onClick={handleUpload} colorScheme="blue">Upload</Button>
      </Flex>

      {sampleFAQs.length > 0 && (
        <Box mt={4} p={4} border="1px solid #555" borderRadius="md" bg="gray.800">
          <Text fontWeight="bold" mb={2} color="white">🧾 Sample FAQs:</Text>
          {sampleFAQs.map((faq, idx) => (
            <Box key={idx} mb={2}>
              <Text color="white">Q: {faq.question}</Text>
              <Text color="gray.400">A: {faq.answer}</Text>
            </Box>
          ))}
        </Box>
      )}

      {faqSource === "uploaded" && sampleFAQs.length === 0 && (
        <Box mt={4} p={3} bg="orange.200" color="gray.900" borderRadius="md">
          <Text fontWeight="medium">📂 Please upload a CSV to view uploaded FAQs.</Text>
        </Box>
      )}

      <VStack
        align="stretch"
        border="1px solid #555"
        borderRadius="md"
        height="400px"
        overflowY="auto"
        p={3}
        mt={6}
        spacing={3}
        bg={bgColor}
      >
        {messages.map((msg, idx) => (
          <Box
            key={idx}
            alignSelf={msg.role === "user" ? "flex-end" : "flex-start"}
            bg={msg.role === "user" ? msgBgUser : msgBgBot}
            borderRadius="md"
            px={3}
            py={2}
            maxW="80%"
          >
            <Text color="white">{msg.content}</Text>
          </Box>
        ))}
      </VStack>

      <Flex gap={2} mt={4}>
        <Input
          placeholder="Type your question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          bg="gray.600"
          color="white"
        />
        <Button onClick={sendMessage} colorScheme="blue">Send</Button>
      </Flex>
    </Container>
  );
}

export default App;
