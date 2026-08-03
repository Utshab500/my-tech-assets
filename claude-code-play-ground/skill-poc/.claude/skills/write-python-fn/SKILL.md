---
name: write-python-fn
description: Generate a Python addition function with type hints, docstring, and optional unit tests
argument-hint: [output-file]
allowed-tools: [Write, Edit, Bash]
---

# Write Python Addition Function

Your job is to write a clean Python addition function and optionally save it to a file.

## Arguments

The user invoked this with: $ARGUMENTS

## Steps

1. Generate the following addition function:

```python
def add(a: int | float, b: int | float) -> int | float:
    """Add two numbers together.

    Args:
        a: The first number.
        b: The second number.

    Returns:
        The sum of a and b.
    """
    return a + b
```

2. Also generate a pytest test:

```python
def test_add():
    assert add(2, 3) == 5
    assert add(-1, 1) == 0
    assert add(1.5, 2.5) == 4.0
```

3. If `$ARGUMENTS` contains a file path, write the function (and test) to that file using the Write tool. Otherwise, display both code blocks to the user.
