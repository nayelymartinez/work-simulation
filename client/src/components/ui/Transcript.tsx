import { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Heading,
  Text,
  Spinner,
  VStack,
  Textarea,
  Button,
  Alert,
  AlertIcon,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Flex,
  useColorModeValue,
  Select,
} from "@chakra-ui/react";

export function Transcript() {
  const userId = 1;
  const [transcriptId, setTranscriptId] = useState(1);

  // Transcript
  const [transcript, setTranscript] = useState("");
  const [summary, setSummary] = useState("");
  const [txLoading, setTxLoading] = useState(true);
  const [txError, setTxError] = useState("");

  // Q&A
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTranscript = async () => {
      setTxLoading(true);
      setTxError("");
      try {
        const { data } = await axios.get<{
          transcript: string;
          summary?: string;
        }>(`http://localhost:3000/agent/transcript/${userId}/${transcriptId}`, {
          params: { onlyTranscript: false },
        });
        setTranscript(data.transcript);
        setSummary(data.summary ?? "");
      } catch (err: any) {
        if (err.response?.status === 404)
          setTxError("Transcript not found — check the ID.");
        else if (err.response?.status === 403)
          setTxError("No permission to view this transcript.");
        else setTxError(err.message || "Unexpected error.");
      } finally {
        setTxLoading(false);
      }
    };
    fetchTranscript();
  }, [transcriptId]);

  const handleQuestion = async () => {
    setLoading(true);
    setError("");
    setAnswer("");
    try {
      const { data } = await axios.post<{
        answer?: string;
        message?: string;
      }>("http://localhost:3000/agent/transcript/question", {
        user_id: userId,
        transcript_id: transcriptId,
        question,
      });
      setAnswer(data.answer ?? "");
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 404)
        setError("Transcript not found — please verify the ID.");
      else if (status === 403)
        setError("You don't have permission to ask questions here.");
      else setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const bgSummary = useColorModeValue("blue.50", "blue.900");
  const bgQA = useColorModeValue("gray.50", "gray.800");
  const bgAnswer = useColorModeValue("green.50", "green.900");
  const headerBg = useColorModeValue("teal.500", "teal.700");

  return (
    <Box maxW="5xl" mx="auto" p={6}>
      {/* HEADER */}

      <Flex justify="space-between" mb={4}>
        <Select
          value={transcriptId}
          onChange={(e) => setTranscriptId(+e.target.value)}
          width="350px"
          variant="filled"
          /* base (resting) state */
          bg="orange.100"
          border="2px solid"
          borderColor="orange.300"
          color="orange.800"
          /* hover: slightly darker orange */
          _hover={{
            bg: "orange.200", // darker than 100
            borderColor: "orange.300",
          }}
          /* focus: keep hover look + outline/ring */
          _focus={{
            bg: "orange.200",
            borderColor: "orange.400",
            boxShadow: "0 0 0 1px var(--chakra-colors-orange-400)",
          }}
          focusBorderColor="orange.400"
          fontWeight="medium"
          rounded="xl"
          shadow="sm"
        >
          <option value={1}>Patient: Natalia Gomez (MRN #: 710)</option>
          <option value={2}>Patient: Alex Gonzalez (MRN #: 711)</option>
        </Select>

        <Box bg="purple.500" px={4} py={2} rounded="md" shadow="md">
          <Text color="white" fontWeight="medium" fontSize="sm">
            Therapist: Dr. Doe
          </Text>
        </Box>
      </Flex>

      <Flex
        bg={headerBg}
        p={4}
        rounded="md"
        mb={6}
        shadow="md"
        align="center"
        justify="space-between"
      >
        <Box>
          <Heading as="h1" size="md" color="white">
            Patient: Natalia Gomez
            <Text
              as="span"
              fontSize="sm"
              fontWeight="normal"
              color="whiteAlpha.800"
              ml={2}
            >
              (MRN #: 710)
            </Text>
          </Heading>
          <Box
            mt={2}
            bg="blue.800"
            px={3}
            py={1}
            rounded="md"
            display="inline-block"
            shadow="sm"
          >
            <Text fontSize="sm" color="white">
              Session Date: June 10, 2025
            </Text>
          </Box>
        </Box>
      </Flex>

      {/* SUMMARY */}
      {summary && (
        <Box
          bg={bgSummary}
          borderLeft="4px solid"
          borderColor="blue.500"
          p={4}
          rounded="md"
          mb={6}
        >
          <Heading as="h2" size="md" color="blue.700" mb={2}>
            Session Summary
          </Heading>
          <Text whiteSpace="pre-wrap">{summary}</Text>
        </Box>
      )}

      {/* Q&A FORM */}
      <VStack
        spacing={4}
        align="stretch"
        bg={bgQA}
        p={4}
        rounded="md"
        shadow="sm"
        mb={6}
      >
        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}
        <Textarea
          placeholder="Ask a question about this transcript…"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          size="md"
        />
        <Button colorScheme="teal" onClick={handleQuestion} isLoading={loading}>
          Submit
        </Button>
      </VStack>

      {/* ANSWER */}
      {answer && (
        <Box bg={bgAnswer} p={4} rounded="md" shadow="sm" mb={6}>
          <Heading as="h3" size="md" color="green.700" mb={2}>
            Answer
          </Heading>
          <Text whiteSpace="pre-wrap">{answer}</Text>
        </Box>
      )}

      {/* TRANSCRIPT */}
      <Box
        bg="gray.50"
        p={4}
        rounded="lg"
        shadow="sm"
        border="1px solid"
        borderColor="blue.500"
        mb={6}
      >
        {txLoading ? (
          <Flex justify="center">
            <Spinner size="xl" />
          </Flex>
        ) : txError ? (
          <Alert status="error">
            <AlertIcon />
            {txError}
          </Alert>
        ) : (
          <Accordion allowToggle>
            <AccordionItem border="none">
              <AccordionButton
                _expanded={{ bg: "blue.400" }}
                px={4}
                py={2}
                rounded="md"
                _hover={{ bg: "blue.100" }}
                bg="gray.200"
              >
                <Box flex="1" textAlign="left" fontWeight="medium">
                  View Transcript
                </Box>
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel pt={4}>
                <Text whiteSpace="pre-wrap" fontSize="sm" color="gray.800">
                  {transcript}
                </Text>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        )}
      </Box>
    </Box>
  );
}
