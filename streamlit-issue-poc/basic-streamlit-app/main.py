import streamlit as st

st.title("Session Satet Basics")

"St.session_state object:", st.session_state

if 'a_counter' not in st.session_state:
    st.session_state['a_acounter'] = 0

st.write(st.session_state)