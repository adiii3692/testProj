package config

import (
	"os"
	"github.com/spf13/viper"
)

type DatabaseConfig struct {
	Host     string
	Port     int
	User     string
	Password string
	DBName   string
	SSLMode  string
}

type RedisConfig struct {
	Host     string
	Port     int
	Password string
	DB       int
}

type TwilioConfig struct {
	AccountSID string
	AuthToken  string
	FromPhone  string
}

type ServerConfig struct {
	Host string
	Port int
}

type Config struct {
	Database DatabaseConfig
	Redis    RedisConfig
	Twilio   TwilioConfig
	Server   ServerConfig
}

func LoadConfig() (*Config, error) {
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(".")
	viper.AddConfigPath("../..")
	viper.AddConfigPath(os.Getenv("CONFIG_PATH"))

	if err := viper.ReadInConfig(); err != nil {
		return nil, err
	}

	var cfg Config
	if err := viper.Unmarshal(&cfg); err != nil {
		return nil, err
	}
	return &cfg, nil
} 