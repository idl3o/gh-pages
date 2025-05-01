require 'tzinfo'
require 'tzinfo/data'

# Force the use of tzinfo-data
TZInfo::DataSource.set(:ruby)
