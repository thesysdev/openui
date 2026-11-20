export const genuiOutput = `root = Stack([welcomeCard])
welcomeCard = Card([welcomeHeader, signupForm])
welcomeHeader = CardHeader("Welcome", "Get started with our platform")
signupForm = Form("signup", actions, [nameField, emailField])
nameField = FormControl("Name", Input("name", "Your name", "text", {required: true, minLength: 2}))
emailField = FormControl("Email", Input("email", "you@example.com", "email", {required: true, email: true}))
actions = Buttons([signUpBtn, learnMoreBtn], "row")
signUpBtn = Button("Sign up", @ToAssistant("Sign me up"), "primary")
learnMoreBtn = Button("Learn more", @ToAssistant("Tell me more about the platform"), "secondary")`;
