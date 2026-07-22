package com.egb.liquibase.sql;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.Environment;

@SpringBootApplication
@Slf4j
public class EgpSqlApplication  {

  @Autowired
  private Environment env;

  public static void main(String[] args) {
    if (args[0].isEmpty()) {
      log.error("No arguments were passed");
      return;
    }
    if (!(args[0].trim().equals("--install") || args[0].trim().equals("--rollback"))) {
      log.error("Only --install or --rollback are the allowed arguments");
      return;
    }
    SpringApplication application = new SpringApplication(EgpSqlApplication.class);
    if(args[0].trim().equals("--install"))
      application.addInitializers(new InstallInitializer());
    else if(args[0].trim().equals("--rollback"))
      application.addInitializers(new RollbackInitializer());

    ConfigurableApplicationContext ctx = application.run(args);
    ctx.close();
  }


  @PostConstruct
  public void check() {
    System.out.println("DB URL = " + env.getProperty("docintel.db.url"));
  }


}
 