+ (Hello|hi|hola) *
- Hello! {@__HELP__}
- Hola! {@__HELP__}
- Hey you! {@__HELP__}

? What can you do
- {@__HELP__}

+ help *
- Sure. {@__HELP__}
- Of course I can. {@__HELP__}
- Don't worry. {@__HELP__}

+ __HELP__
- You can ask me queries like:\n
^ Does the "component type" "component name" depend on the "component type" "component name"?\n
^ - Example: Does the application crm depend on the business process loan application?\n\n
^ Other stuff you can ask me:\n
^ List component types\n
^ Search for component "name of component"\n
^ Describe the component "name of component"\n
^ How many applications do we have?\n

+ Count [the] [number] [of] *(1-10)
- Counting. \n
^ ^countComponents(<cap1>)
- Checking. \n
^ ^countComponents(<cap1>)

? [And] how many *(1-10)
- Counting. \n
^ ^countComponents(<cap1>)
- Checking. \n
^ ^countComponents(<cap1>)

? [How] many *(1-10) do we have
- Counting. \n
^ ^countComponents(<cap1>)
- Checking. \n
^ ^countComponents(<cap1>)

? (Are|Does|is|will|do|can) [change][deploy][changes][deploys] [to] [the] *(2-10) (link|link|depend|depend|reference|impact|affect|effect|hit)[s] [on] [to] [the] *(1-10)
- Let me check.\n
^ ^dependOn(<cap2>, <cap4>)
- Checking in Ardoq.\n
^ ^dependOn(<cap2>, <cap4>)
- I will search.\n
^ ^dependOn(<cap2>, <cap4>)

+ * component types *
- You have the following component types: \n
^ ^componentTypes()

+ (search|find) [for] [the] components named *(1-10)
- Searching for <cap2>\n
^ ^searchComponent(<cap2>)

+ (search|find) [for] [the] component *(1-10)
- Searching for <cap2>\n
^ ^searchComponent(<cap2>)

+ (search|list|find) [for] *(1-10)
- Searching for <cap2>\n
^ ^searchComponent(<cap2>)



+ describe [the] [component] *(1-10)
- checking...
^ ^describeComponent(<cap1>)

+ *
- I don't understand. {@__HELP__}
