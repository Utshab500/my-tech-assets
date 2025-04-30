# Dockerfile

# Use the official Python image from the DockerHub
FROM python:3.11

RUN apt-get update && apt-get install -y \
    && apt-get clean

# Set the working directory
WORKDIR /app

# Copy the requirements.txt file
COPY requirements.txt .

# Install the Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Copy supervisor configuration
# COPY supervisord.conf /etc/supervisord.conf

# Expose the port Streamlit is running on
EXPOSE 8501

# Command to run the Streamlit app
CMD ["streamlit", "run", "main.py", "--server.port=8501", "--server.enableCORS=false", "--server.enableXsrfProtection=false" , "--server.headless=true"]