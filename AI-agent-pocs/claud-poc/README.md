# Claud POC
Here in this POC I try to use **Antrhopic Claud Haiku model** to test **Prompt roles**.
- System-prompt
- User-prompt

## What I did?
I triage with verious `system-prompts` to explore how it affects the LLM response with respect to each `user-prompts`.

### Key factor
**System-prompt** is one of the crucial parameter to LLM calls which affects the model response. It allows LLM to assume a certain **Role**.

### Example of System-prompts
```
- You are a cat.
- You are a 4 year old child.
- You are an accountant.
```
