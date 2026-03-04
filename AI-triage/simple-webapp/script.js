const display = document.getElementById('display');
let shouldResetDisplay = false; // True if the next digit input should clear the display

function appendToDisplay(value) {
    if (display.value === 'Error') {
        display.value = ''; // Clear error before new input
    }

    // If result is shown, and next input is a number (not operator/decimal), start new calculation
    if (shouldResetDisplay && !isOperator(value) && value !== '.') {
        display.value = '';
    }
    shouldResetDisplay = false; // Reset flag for any subsequent input

    const currentValue = display.value;
    const lastChar = currentValue.slice(-1);

    if (isOperator(value)) {
        // Don't start with an operator unless it's '-'
        if (currentValue === '' && value !== '-') {
            return;
        }
        // If last char is an operator
        if (isOperator(lastChar)) {
            // Allow '*/-' for negative numbers: e.g. 5 * -
            if (value === '-' && (lastChar === '*' || lastChar === '/')) {
                 // Avoid '5*--' by checking if it's already 'operator + minus'
                if (currentValue.length > 1 && currentValue.slice(-2) === lastChar + value) {
                    return; 
                }
                display.value += value;
            }
            // If we have something like '5*-' and user presses '+', change to '5+'
            else if (currentValue.length > 1 && isOperator(currentValue.slice(-2, -1)) && lastChar === '-') {
                 display.value = currentValue.slice(0, -2) + value;
            }
            // Otherwise, replace the last operator: e.g. '5+' + '*' -> '5*'
            else {
                display.value = currentValue.slice(0, -1) + value;
            }
        } else {
            // Last char is not an operator, or display is empty (and value is '-')
            display.value += value;
        }
    } else if (value === '.') {
        // Find current number segment (part after the last operator or start of string)
        const segments = currentValue.split(/([+\-*/])/);
        const currentNumberStr = segments.length > 0 ? segments[segments.length - 1] : "";

        // Prevent multiple decimals in the current number segment
        if (currentNumberStr.includes('.')) {
            return;
        }
        // If display is empty, or last char is an operator (or part of 'operator-'), prepend '0'
        if (currentValue === '' || isOperator(lastChar) || (lastChar === '-' && currentValue.length > 1 && isOperator(currentValue.slice(-2,-1)))) {
            display.value += '0.';
        } else {
            display.value += '.';
        }
    } else { // Digit
        display.value += value;
    }
}

function isOperator(char) {
    return ['+', '-', '*', '/'].includes(char);
}

function clearDisplay() {
    display.value = '';
    shouldResetDisplay = false;
}

function deleteLast() {
    if (display.value === 'Error') {
        clearDisplay();
        return;
    }
    display.value = display.value.slice(0, -1);
}

function calculateResult() {
    if (display.value === '' || display.value === 'Error') {
        return;
    }

    let expression = display.value;
    const lastChar = expression.slice(-1);

    // If expression ends with an operator that isn't part of a negative number sequence (e.g. "5*-")
    // then it's an incomplete expression.
    if (isOperator(lastChar)) {
        if (expression.length > 1 && lastChar === '-' && (expression.slice(-2,-1) === '*' || expression.slice(-2,-1) === '/')) {
            // This is like "5*-", which is incomplete for direct evaluation
            display.value = 'Error';
            shouldResetDisplay = true;
            return;
        }
        // Otherwise, remove trailing operator for evaluation (e.g. "5+" becomes "5")
        expression = expression.slice(0, -1);
    }
    
    if (expression === '' || isOperator(expression.slice(-1))) { // Check again if expression became empty or ends with op
        display.value = 'Error';
        shouldResetDisplay = true;
        return;
    }

    try {
        // Using Function constructor is generally safer than eval for controlled inputs.
        // For a production app, a dedicated math expression parser would be more robust.
        const result = new Function('return ' + expression)();

        if (isNaN(result) || !isFinite(result)) {
            display.value = 'Error';
        } else {
            display.value = parseFloat(result.toFixed(10)); // Format to avoid long decimals and remove trailing zeros
        }
        shouldResetDisplay = true;
    } catch (error) {
        display.value = 'Error';
        shouldResetDisplay = true;
    }
}

// Keyboard support
document.addEventListener('keydown', function(event) {
    const key = event.key;

    if (key >= '0' && key <= '9') appendToDisplay(key);
    else if (key === '.') appendToDisplay('.');
    else if (key === '+') appendToDisplay('+');
    else if (key === '-') appendToDisplay('-');
    else if (key === '*') appendToDisplay('*');
    else if (key === '/') appendToDisplay('/');
    else if (key === '=' || key === 'Enter') {
        event.preventDefault(); // Prevent default action for Enter/equals key
        calculateResult();
    } else if (key === 'Backspace') deleteLast();
    else if (key === 'Escape' || key.toLowerCase() === 'c') clearDisplay();
});