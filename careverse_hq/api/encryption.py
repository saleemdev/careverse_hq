import frappe, base64, os, json
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from frappe.model.document import Document
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.backends import default_backend
from datetime import date, timedelta
import hashlib
import jwt
from datetime import datetime
from Crypto.Cipher import AES
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_OAEP
from Crypto.Util.Padding import pad, unpad
from Crypto.Random import get_random_bytes


class DictionaryManager:
    def __init__(self, private_key_str=None, public_key_str=None, agent=None):
        self.backend = default_backend()
        self.aes_key_size = 32  # 256-bit AES key
        # Sometimes we ned a custom key-value pair
        current_client_public_key = None
        if agent:
            args = dict(agent_id=agent, active=1)
            private_key_str, public_key_str, current_client_public_key = (
                frappe.db.get_value(
                    "Identity Auth RSA Keys",
                    args,
                    ["private_key", "public_key", "client_public_key"],
                )
            )
        # Load private and public keys
        self.private_key = self.load_private_key(private_key_str)
        self.public_key = self.load_public_key(
            current_client_public_key or public_key_str
        )
        self.private_key_str = private_key_str
        self.public_key_str = current_client_public_key or public_key_str

    # Load private key from a string
    def load_private_key(self, private_key_str):
        return serialization.load_pem_private_key(
            private_key_str.encode("utf-8"), password=None, backend=self.backend
        )

    # Load public key from a string
    def load_public_key(self, public_key_str):
        return serialization.load_pem_public_key(
            public_key_str.encode("utf-8"), backend=self.backend
        )

    # Generate AES key
    def generate_aes_key(self):
        return os.urandom(self.aes_key_size)

    # AES encrypt
    def aes_encrypt(self, key, plaintext):
        iv = os.urandom(16)  # 128-bit IV
        cipher = Cipher(algorithms.AES(key), modes.CFB(iv), backend=self.backend)
        encryptor = cipher.encryptor()
        ciphertext = encryptor.update(plaintext) + encryptor.finalize()
        return iv, ciphertext

    # AES decrypt
    def aes_decrypt(self, key, iv, ciphertext):
        cipher = Cipher(algorithms.AES(key), modes.CFB(iv), backend=self.backend)
        decryptor = cipher.decryptor()
        return decryptor.update(ciphertext) + decryptor.finalize()

    # # RSA encrypt using SHA-1 padding
    # def rsa_encrypt(self, plaintext):
    #     return self.public_key.encrypt(
    #         plaintext,
    #         padding.OAEP(
    #             mgf=padding.MGF1(algorithm=hashes.SHA1()),  # Using SHA-1
    #             algorithm=hashes.SHA1(),
    #             label=None,
    #         ),
    #     )

    # # RSA decrypt using SHA-1 padding
    # def rsa_decrypt(self, ciphertext):
    #     return self.private_key.decrypt(
    #         ciphertext,
    #         padding.OAEP(
    #             mgf=padding.MGF1(algorithm=hashes.SHA1()),  # Using SHA-1
    #             algorithm=hashes.SHA1(),
    #             label=None,
    #         ),
    #     )

    # Encrypt large JSON using AES (AES key is encrypted with RSA)
    def encrypt_json(self, json_data):
        aes_key = self.generate_aes_key()
        json_bytes = json.dumps(json_data).encode("utf-8")

        # AES encrypt the JSON data
        iv, ciphertext = self.aes_encrypt(aes_key, json_bytes)

        # RSA encrypt the AES key
        encrypted_aes_key = self.rsa_encrypt(aes_key)

        # Combine the encrypted AES key, IV, and ciphertext into one base64 string
        combined_data = base64.b64encode(encrypted_aes_key + iv + ciphertext).decode(
            "utf-8"
        )

        return combined_data

    # Decrypt large JSON using AES (AES key is decrypted with RSA)
    def decrypt_json(self, encrypted_data):
        # Decode the base64 string
        combined_data = base64.b64decode(encrypted_data)

        # Extract the encrypted AES key, IV, and ciphertext from the combined data
        encrypted_aes_key = combined_data[:256]  # 2048-bit RSA key -> 256 bytes
        iv = combined_data[256:272]  # 16 bytes IV
        ciphertext = combined_data[272:]  # Rest is the ciphertext

        # RSA decrypt the AES key
        aes_key = self.rsa_decrypt(encrypted_aes_key)

        # AES decrypt the JSON data
        json_bytes = self.aes_decrypt(aes_key, iv, ciphertext)
        return json.loads(json_bytes.decode("utf-8"))

    # NEW ENCRYPTION OCT 14
    def encrypt_with_rsa_v2(self, data):
        rsa_key = RSA.import_key(self.public_key_str)
        cipher = PKCS1_OAEP.new(rsa_key)
        encrypted_data = cipher.encrypt(data.encode())
        return base64.b64encode(encrypted_data).decode()

    # Function to perform AES encryption
    def encrypt_with_aes_v2(self, json_data, aes_key, iv):
        cipher = AES.new(aes_key, AES.MODE_CBC, iv)
        padded_data = pad(json_data.encode(), AES.block_size)
        encrypted_data = cipher.encrypt(padded_data)
        return base64.b64encode(encrypted_data).decode()

    # Main execution
    def encrypt_data_v2(self, payload):
        # JSON data to be encrypted
        payload = json.dumps(payload)
        json_data = payload
        # json_data = "{'payload':'payload'}"
        # json_data = json.dumps(payload).encode('utf-8')
        # Generate AES key and IV (256-bit key and 16-byte IV)
        aes_key = get_random_bytes(32)  # 32 bytes for AES-256
        iv = get_random_bytes(16)  # 16 bytes IV

        # Encrypt the JSON data using AES
        encrypted_json_data = self.encrypt_with_aes_v2(json_data, aes_key, iv)

        # Encrypt AES key and IV using RSA
        encrypted_aes_key = self.encrypt_with_rsa_v2(base64.b64encode(aes_key).decode())
        encrypted_iv = self.encrypt_with_rsa_v2(base64.b64encode(iv).decode())

        # Combine AES key, IV, and encrypted JSON data
        combined_string = f"{encrypted_aes_key}:{encrypted_iv}:{encrypted_json_data}"
        combined_base64 = base64.b64encode(combined_string.encode()).decode()

        # Output the combined base64 string
        # print("Combined Encrypted Data (Base64):", combined_base64)
        return combined_base64

    # Decryption
    # Function to decrypt AES key using RSA private key
    def decrypt_with_rsa_v2(self, encrypted_data):
        rsa_key = RSA.import_key(self.private_key_str)
        cipher = PKCS1_OAEP.new(rsa_key)
        decrypted_data = cipher.decrypt(base64.b64decode(encrypted_data))
        return base64.b64decode(decrypted_data)

    # Function to decrypt AES-encrypted data
    def decrypt_with_aes_v2(self, encrypted_data, aes_key, iv):
        cipher = AES.new(aes_key, AES.MODE_CBC, iv)
        decrypted_data = unpad(
            cipher.decrypt(base64.b64decode(encrypted_data)), AES.block_size
        )
        return decrypted_data.decode()

    # Main execution
    def decrypt_data_v2(self, encrypted_base64):
        # Combined base64 string from encryption
        combined_base64 = encrypted_base64

        # Split the combined base64 string to get encrypted AES key, IV, and JSON data
        combined_string = base64.b64decode(combined_base64).decode()
        encrypted_aes_key, encrypted_iv, encrypted_json_data = combined_string.split(
            ":"
        )

        # Decrypt the AES key and IV using the RSA private key
        aes_key = self.decrypt_with_rsa_v2(encrypted_aes_key)
        iv = self.decrypt_with_rsa_v2(encrypted_iv)

        # Decrypt the JSON data using the AES key and IV
        decrypted_json_data = self.decrypt_with_aes_v2(encrypted_json_data, aes_key, iv)

        # Load the decrypted JSON data
        data = json.loads(decrypted_json_data)

        # Output the decrypted JSON data
        # print("Decrypted JSON Data:", json.dumps(data, indent=2))
        return dict(data=data)

    # encrypted_base64 = "QzhWaVNjYVJreFdVY243U0Z0M3JNUWpjMWNlSVUwSWFGZ0kwR1VLeW1GNStPU0E1NHozRk5BODRCVUgzQ0ZXTDJYTXhxejNEaEJFRFlEdjF1cTdYdHM4djAzMFQ1TkNHSXF6QW1IeDNEVFJiakhraEtmNGVkMzNLaXhLaG91V2tJaVpRQitBSEkxalJQNjkvTGhDMlJoN21pZ0h3dmdXTXZiUDdsd2h1cERTT3pzeUdHSWN6ckxIYVgvRjZpbFN1ZHRFTW1hRE1qTTlkWXU4MU9ScWgxSlUyNWdoeExQUzAzTFhVV3AzbUg3NW40QUQ5dS83QXN4VFIxWmRwcDQ3M1JUbnZOUGZWdFNFVzRlQi9ad0FORFdpWndhem43NGM2SVUycFp3dlBiM0JvNUY5NVU1K1NvOGx0VWxndGJZTG93VlFQUUFKc043ZlFkYTZUQXluODR3PT06dXc2WWFXa1ZNQmZ2c2hhNGNFSlJUUzdBZ1BiRXlrd1ZNSTI1TGhEL05wV3pyMVkwemdtVzNNcDN4QTlsVzZmZ3JyVEIwN0hqUGhHNlBhRXNwaytGRVpYeDFrZWlqczJ4T1BuZ1lBTzZPRDQwZ0c2VlA1My91bmp6UjBhdG5uZk4zanlhalJsNk12OWtBdUxCOG1SMTFwY0RYK2YzUzNnNEw2S2UybDhuNVlXSVNzWHpJUTF5Qnd6aUdxZlY0S0IxODQrR0RmQVR5Z3NoTUN1K0dhWnIwQm5BWEZCT1pmdUdCcDJNVElqRGFzQjZ6WS8yU1M0NVNmRS83YjB2OEZsd0x1MVRqWFROR2FvQlFIRndGbVRrekdYREpWTkswMUtIQTk2cEdJNkNYejNJT2VDZ2RWTmRHL0RaMTFGT2wzR3NZS3p1T3poaG9TaDNxUVhndkhZOE5RPT06TTI1YVBpV3p6YXREWFA1TDc1VnZTMjM1N1FsQWdCZDA3dTJzejVOaGpsRmtjTEcxMWVvRUwzMVk2QXNERTBrc1JuR25RQ0I0NU8xSTdPbmxWbnhZRVNEV2F5bCtmUTNxay95MGVPVTZ0ZkxFY0N0Q0xTZHJhQUZxNlF0Snk4NG91SnpaMEExb2F3YkxKVWZGaXk1VDNyc2VFeWd2TmR0OGpvdmRrNXYwRGNzPQ=="
    # decrypt_data(private_key,encrypted_base64)


class SecureTransportManager:
    """Handles encryption, decryption, and validation of all data exchanged between backend and frontend."""

    def __init__(self):
        self.settings = frappe.get_single("HealthPro Backend Settings")
        self.jwt_security_hash = self.settings.jwt_security_hash
        self.otp_expiry_minutes = self.settings.otp_expiry_minutes

    def generate_jwt_token(
        self,
        expiry_minutes=None,
        **kwargs,
    ):
        if expiry_minutes is None:
            expiry_minutes = self.otp_expiry_minutes
        otp_record = kwargs.get("otp_record")
        exp_time = datetime.now() + timedelta(minutes=expiry_minutes)
        payload = {"otp_record": otp_record, "exp": exp_time.timestamp()}

        # Encode the JWT token
        token = jwt.encode(payload, self.jwt_security_hash, algorithm="HS256")

        # jwt.encode might return bytes in some versions of PyJWT, so we convert to string if needed
        if isinstance(token, bytes):
            return token.decode("utf-8")
        return token

    def decode_jwt_token(self, token):
        """
        Decrypt a JWT token that was created with the generate_jwt_token function.
        """
        try:
            # Use the same secret key and algorithm as in the encoding function
            payload = jwt.decode(token, self.jwt_security_hash, algorithms=["HS256"])

            # Convert the exp timestamp back to a datetime object if needed
            if "exp" in payload:
                payload["exp"] = datetime.fromtimestamp(payload["exp"])

            return payload
        except jwt.ExpiredSignatureError:
            return {"error": "Encryption Token has expired"}
        except jwt.InvalidTokenError:
            return {"error": "Invalid Encryption token"}

    def rsa_encrypt(self, data):
        """Encrypt data using public key"""
        settings = frappe.get_doc("HealthPro Backend Settings")
        encrypter = DictionaryManager(
            private_key_str=settings.private_key, public_key_str=settings.public_key
        )
        encrypted_data = encrypter.encrypt_data_v2(data)
        return encrypted_data

    def rsa_decrypt(self, encrypted_data):
        """Encrypt data using private key"""
        settings = frappe.get_doc("HealthPro Backend Settings")
        decrypter = DictionaryManager(
            private_key_str=settings.private_key, public_key_str=settings.public_key
        )
        decrypted_data = decrypter.decrypt_data_v2(encrypted_data)
        return decrypted_data

    def encrypt_security_key(self, **kwargs):
        """Returns a key using a jwt_token of the otp record which is then rsa encrpyted"""
        otp_record = kwargs.get("otp_record")
        jwt_token = self.generate_jwt_token(otp_record=otp_record)
        key = self.rsa_encrypt(jwt_token)
        return key

    def decrypt_security_key(self, encrypted_key):
        """
        Decrypts the security key that was created using encrypt_security_key.
        Returns the original JWT token containing the OTP.
        """
        # First decrypt the RSA encrypted key to get the JWT token
        jwt_token = self.rsa_decrypt(encrypted_key)

        # Then decode the JWT token to get the original payload with OTP
        print(jwt_token)
        token_data = jwt_token.get("data")
        payload = self.decode_jwt_token(token_data)
        return payload

    def encrypt_security_token(self, **kwargs):
        """Create a SHA-256 hash of username and OTP combined. Return the result in base64 format."""
        username = kwargs.get("username")
        otp_record = kwargs.get("otp_record")
        # Convert both values to strings if they aren't already
        if not isinstance(username, str):
            username = str(username)
        if not isinstance(otp_record, str):
            otp_record = str(otp_record)

        # Combine the values
        combined = f"{username}:{self.jwt_security_hash}:{otp_record}"
        print(combined)

        # Convert to bytes for hashing
        combined_bytes = combined.encode("utf-8")

        # Create the SHA-256 hash
        hash_obj = hashlib.sha256(combined_bytes)

        # Get binary digest and encode to base64
        binary_hash = hash_obj.digest()
        token = base64.b64encode(binary_hash).decode("utf-8")
        return token

    def verify_security_token(self, token, **kwargs):
        """
        Verifies if the provided token matches what would be generated with the given username and OTP.
        """
        username = kwargs.get("username")
        otp_record = kwargs.get("otp_record")

        # Generate a token with the provided credentials
        expected_token = self.encrypt_security_token(
            username=username, otp_record=otp_record
        )
        print(expected_token)

        # Compare with the provided token (constant-time comparison would be better for security)
        return token == expected_token
