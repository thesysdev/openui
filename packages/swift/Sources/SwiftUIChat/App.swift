import SwiftUI
import OpenUILang
import OpenUISwiftUI

@main
struct SwiftUIChatApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

struct ContentView: View {
    @State private var library = ComponentLibrary()
    @State private var openUIText = ""
    @State private var parsedRoot: ElementNode? = nil
    @State private var prompt = ""
    @State private var showingAlert = false
    @State private var alertMessage = ""
    
    // We create parser on demand or as a lazy property since library can change, but since library is basically static here:
    var parser: Parser {
        Parser(library: library)
    }
    
    init() {
        let lib = ComponentLibrary()
        lib.register(component: ComponentDef(name: "VStack", description: "Vertical layout container", signature: "VStack(children: [Any])"))
        lib.register(component: ComponentDef(name: "HStack", description: "Horizontal layout container", signature: "HStack(children: [Any])"))
        lib.register(component: ComponentDef(name: "Text", description: "Text display", signature: "Text(text: String)"))
        lib.register(component: ComponentDef(name: "Button", description: "Clickable button", signature: "Button(label: String, action: String)"))
        lib.setRoot("VStack")
        _library = State(initialValue: lib)
        _prompt = State(initialValue: PromptGenerator.generatePrompt(library: lib))
    }
    
    var body: some View {
        HStack {
            VStack {
                Text("OpenUI Lang Output")
                    .font(.headline)
                TextEditor(text: $openUIText)
                    .font(.system(.body, design: .monospaced))
                    .padding()
                    .border(Color.gray, width: 1)
                    .onChange(of: openUIText) { newValue in
                        let result = parser.parse(newValue)
                        self.parsedRoot = result.root
                    }
            }
            .frame(maxWidth: .infinity)
            
            VStack {
                Text("Rendered SwiftUI")
                    .font(.headline)
                
                ScrollView {
                    VStack {
                        if let root = parsedRoot {
                            OpenUIRenderer(node: root, library: library, actionHandler: { action, props in
                                self.alertMessage = "Action Triggered: \(action)"
                                self.showingAlert = true
                            })
                        } else {
                            Text("Awaiting input...")
                                .foregroundColor(.gray)
                        }
                    }
                    .padding()
                    .frame(maxWidth: .infinity, alignment: .top)
                }
                .border(Color.gray, width: 1)
            }
            .frame(maxWidth: .infinity)
        }
        .padding()
        .alert(isPresented: $showingAlert) {
            Alert(title: Text("Action Executed"), message: Text(alertMessage), dismissButton: .default(Text("OK")))
        }
        .onAppear {
            self.openUIText = """
            $isLoading = false
            
            root = VStack([
                Text($isLoading ? "Please wait..." : "Hello from OpenUI Lang"),
                HStack([
                    Button("Cancel", "submit:cancel"),
                    Button("Submit", "submit:signup")
                ])
            ])
            """
            let result = parser.parse(self.openUIText)
            self.parsedRoot = result.root
        }
    }
}
