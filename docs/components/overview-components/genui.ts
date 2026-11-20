export const genuiOutput = `root = Col([welcomeCard])
$name = ""
$email = ""
welcomeCard = Card([Title("Welcome", "lg"), Text("Get started with our platform", "sm", "muted"), signupForm])
signupForm = Form([nameField, emailField, actions])
nameField = Input($name, "Name", "text", "Your name", {required: true, minLength: 2})
emailField = Input($email, "Email", "text", "you@example.com", {required: true, email: true})
actions = Row([signUpBtn, learnMoreBtn], 2)
signUpBtn = Button("Sign up", @ToAssistant("Sign me up"))
learnMoreBtn = Button("Learn more", @ToAssistant("Tell me more about the platform"), "outline")`;
