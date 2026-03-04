from models import claud
from models import gemini

def read_file(file_path):
    """
    Read and return the contents of a file.
    
    Args:
        file_path (str): Path to the file to read
        
    Returns:
        str: Contents of the file
        
    Raises:
        FileNotFoundError: If the file doesn't exist
        IOError: If there's an error reading the file
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read()
    except FileNotFoundError:
        raise FileNotFoundError(f"File not found: {file_path}")
    except IOError as e:
        raise IOError(f"Error reading file {file_path}: {str(e)}")

def get_completion(prompt, system_prompt=''):
    system_prompt = "You are an accountant."
    messages = [
        {
            "role":"system",
            "content": system_prompt
        },
        {
            "role": "user", 
            "content": prompt
        }
    ]

    # Call the model
    model = gemini.get_model()
    response = model.invoke(
        messages,
        temperature=0.0,
        top_p=1
    )
    return response.content

if __name__ == "__main__":
    # Single execution testing
    # ---------------------------
    # print(read_file("prompt-library/mutual-fund-portfolio-analysis.txt"))

    # Actual execution
    # ---------------------------
    prompt = read_file("prompt-library/mutual-fund-portfolio-analysis.txt")
    print(get_completion(prompt))