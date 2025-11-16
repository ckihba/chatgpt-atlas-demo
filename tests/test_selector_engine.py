import pytest
from agent_lib.dom_snapshot import DOMSnapshot
from agent_lib.selector_engine import SelectorEngine


def test_selector_engine_find_input():
    """Test that SelectorEngine can find an input element by natural-language goal."""
    with open('sample_page.html', 'r') as f:
        html = f.read()
    
    snapshot = DOMSnapshot.from_html(html, url='sample_page.html')
    engine = SelectorEngine()
    
    # Try to find an input for "Enter username"
    el, conf = engine.find_element('Enter username', snapshot)
    
    assert el is not None, "Should find element for 'Enter username' goal"
    assert el.tag == 'input', f"Expected input tag, got {el.tag}"
    assert conf > 0, "Confidence should be > 0"


def test_selector_engine_find_button():
    """Test that SelectorEngine can find a button element by natural-language goal."""
    with open('sample_page.html', 'r') as f:
        html = f.read()
    
    snapshot = DOMSnapshot.from_html(html, url='sample_page.html')
    engine = SelectorEngine()
    
    # Try to find a button for "Click Submit"
    el, conf = engine.find_element('Click Submit', snapshot)
    
    assert el is not None, "Should find element for 'Click Submit' goal"
    assert el.tag == 'button', f"Expected button tag, got {el.tag}"
    assert conf > 0, "Confidence should be > 0"
