*** Settings ***
Library    Browser

*** Test Cases ***
Open App
    New Browser    chromium
    New Page    http://localhost:5173
    Click    text=Login
    Fill Text    input[name="email"]    test@test.com

#testing