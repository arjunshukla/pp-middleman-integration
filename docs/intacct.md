# Intacct Configuration
You need to extend the ARINVOICE Object to add the following fields
* PAYPALINVOICEID | 24

| Object        | Data Type     | Label                  | Field ID                 | Other                                 |
| ------------- |:-------------:| ----------------------:| ----------------------:  | ------------------------------------: |
| Invoice       | Text          | PAYPALINVOICEID        | PAYPALINVOICEID          | Length = 24.  Use show on page to your liking |
| Invoice       | Text Area     | PAYPALINVOICEMESSAGE   | PAYPALINVOICEMESSAGE     | Number of rows to display set to 10   |
