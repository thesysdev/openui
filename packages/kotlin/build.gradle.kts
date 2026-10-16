plugins {
    kotlin("jvm") version "2.1.21" apply false
    id("com.android.library") version "8.10.1" apply false
    id("com.android.application") version "8.10.1" apply false
    id("org.jetbrains.kotlin.android") version "2.1.21" apply false
    id("org.jetbrains.kotlin.plugin.compose") version "2.1.21" apply false
}

subprojects {
    group = "dev.openui"
    version = "0.1.0"
}
