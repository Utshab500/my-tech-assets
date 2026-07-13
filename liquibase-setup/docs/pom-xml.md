# pom.xml
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.5.6</version>
    <relativePath/> <!-- lookup parent from repository -->
  </parent>
  <groupId>com.egb.liquibase</groupId>
  <artifactId>docintel-sql</artifactId>
  <version>1.0.21</version>
  <name>docintel-sql</name>
  <description>EGP SQL Deployment</description>
  <properties>
    <java.version>17</java.version>
    <oracle.jdbc.version>23.8.0.25.04</oracle.jdbc.version>
    <osdt.version>21.18.0.0</osdt.version>
  </properties>
  <dependencies>
    <dependency>
      <groupId>org.projectlombok</groupId>
      <artifactId>lombok</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
      <groupId>org.liquibase</groupId>
      <artifactId>liquibase-core</artifactId>
    </dependency>
    <dependency>
      <groupId>com.oracle.database.jdbc</groupId>
      <artifactId>ojdbc11</artifactId>
      <version>${oracle.jdbc.version}</version>
    </dependency>
    <dependency>
      <groupId>com.oracle.database.security</groupId>
      <artifactId>oraclepki</artifactId>
      <version>${oracle.jdbc.version}</version>
    </dependency>
    <dependency>
      <groupId>com.oracle.database.security</groupId>
      <artifactId>osdt_core</artifactId>
      <version>${osdt.version}</version>
    </dependency>
    <dependency>
      <groupId>com.oracle.database.security</groupId>
      <artifactId>osdt_cert</artifactId>
      <version>${osdt.version}</version>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-test</artifactId>
      <scope>test</scope>
    </dependency>
  </dependencies>
  <build>
    <plugins>
      <plugin>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-maven-plugin</artifactId>
      </plugin>
    </plugins>
  </build>
</project>
 
```