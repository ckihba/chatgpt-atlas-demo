import pytest
from agent_lib.dom_snapshot import DOMSnapshot


def test_dom_snapshot_parse():
    """Test that DOMSnapshot can parse sample_page.html and find inputs/buttons."""
    with open('sample_page.html', 'r') as f:
        html = f.read()
    
    snapshot = DOMSnapshot.from_html(html, url='sample_page.html')
    
    # Expect at least one input and one button
    inputs = snapshot.get_elements_by_tag('input')
    buttons = snapshot.get_elements_by_tag('button')
    
    assert len(inputs) > 0, "Should find at least one input element"
    assert len(buttons) > 0, "Should find at least one button element"


def test_find_input_by_name():
    """Test finding an input by name attribute."""
    with open('sample_page.html', 'r') as f:
        html = f.read()
    
    snapshot = DOMSnapshot.from_html(html, url='sample_page.html')
    username_input = snapshot.find_input_by_name('username')
    
    assert username_input is not None, "Should find input with name='username'"
    assert username_input.tag == 'input'
