def add(a: int | float, b: int | float) -> int | float:
    """Add two numbers together.

    Args:
        a: The first number.
        b: The second number.

    Returns:
        The sum of a and b.
    """
    return a + b


def main():
    x, y = 7, 5
    result = add(x, y)
    print(f"The sum of {x} and {y} is: {result}")


def test_add():
    assert add(2, 3) == 5
    assert add(-1, 1) == 0
    assert add(1.5, 2.5) == 4.0


if __name__ == "__main__":
    main()
